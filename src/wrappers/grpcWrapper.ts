import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { EventEmitter } from 'node:events';

export interface RetryOptions {
    maxRetries?: number;
    retryDelay?: number;
    retryableStatusCodes?: grpc.status[];
}

export interface InterceptorContext {
    method: string;
    request: any;
    metadata: grpc.Metadata;
}

export type ClientInterceptor = (
    context: InterceptorContext,
    next: () => Promise<any>
) => Promise<any>;

export type ServerInterceptor = (
    call: grpc.ServerUnaryCall<any, any> | grpc.ServerReadableStream<any, any>,
    callback: grpc.sendUnaryData<any>,
    next: () => void
) => void;

export interface GrpcWrapperOptions {
    protoPath: string;
    packageName: string;
    serviceName: string;
    host: string;
    port: number;
    credentials?: grpc.ChannelCredentials;
    protoLoaderOptions?: protoLoader.Options;
    channelOptions?: grpc.ChannelOptions;
    retryOptions?: RetryOptions;
    timeout?: number; // Default timeout in milliseconds
    interceptors?: ClientInterceptor[];
}

export interface GrpcServerOptions {
    protoPath: string;
    packageName: string;
    serviceName: string;
    host: string;
    port: number;
    credentials?: grpc.ServerCredentials;
    protoLoaderOptions?: protoLoader.Options;
    enableHealthCheck?: boolean;
    interceptors?: ServerInterceptor[];
    maxConcurrentCalls?: number;
}

export class GrpcClientWrapper extends EventEmitter {
    private client: any;
    private readonly options: GrpcWrapperOptions;
    private packageDefinition: any;
    private proto: any;
    private interceptors: ClientInterceptor[];
    private isConnected: boolean = false;

    constructor(options: GrpcWrapperOptions) {
        super();
        this.options = {
            ...options,
            credentials: options.credentials || grpc.credentials.createInsecure(),
            protoLoaderOptions: options.protoLoaderOptions ?? {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            },
            retryOptions: options.retryOptions ?? {
                maxRetries: 3,
                retryDelay: 1000,
                retryableStatusCodes: [
                    grpc.status.UNAVAILABLE,
                    grpc.status.DEADLINE_EXCEEDED,
                    grpc.status.RESOURCE_EXHAUSTED,
                ],
            },
            timeout: options.timeout ?? 30000, // 30 seconds default
        };
        this.interceptors = options.interceptors || [];
    }

    async connect(): Promise<void> {
        try {
            this.packageDefinition = await protoLoader.load(
                this.options.protoPath,
                this.options.protoLoaderOptions
            );

            this.proto = grpc.loadPackageDefinition(this.packageDefinition);

            const packagePath = this.options.packageName.split('.');
            let service = this.proto;
            for (const key of packagePath) {
                service = service[key];
            }

            const ServiceConstructor = service[this.options.serviceName];

            if (!ServiceConstructor) {
                throw new Error(`Service ${this.options.serviceName} not found in package ${this.options.packageName}`);
            }

            this.client = new ServiceConstructor(
                `${this.options.host}:${this.options.port}`,
                this.options.credentials,
                this.options.channelOptions
            );

            this.isConnected = true;
            this.emit('connected');
            this.monitorConnection();
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    async call<TRequest = any, TResponse = any>(
        method: string,
        request: TRequest,
        metadata?: grpc.Metadata,
        options?: { timeout?: number; retry?: boolean }
    ): Promise<TResponse> {
        if (!this.client) {
            throw new Error('Client not connected. Call connect() first.');
        }

        const context: InterceptorContext = {
            method,
            request,
            metadata: metadata || new grpc.Metadata(),
        };

        // Execute interceptors
        const executeCall = async (): Promise<TResponse> => {
            return this.executeWithRetry(
                () => this.makeUnaryCall<TRequest, TResponse>(method, request, context.metadata, options?.timeout),
                options?.retry ?? true
            );
        };

        return this.applyInterceptors(context, executeCall);
    }

    private async makeUnaryCall<TRequest, TResponse>(
        method: string,
        request: TRequest,
        metadata: grpc.Metadata,
        timeout?: number
    ): Promise<TResponse> {
        return new Promise((resolve, reject) => {
            const deadline = Date.now() + (timeout || this.options.timeout!);
            metadata.set('deadline', deadline.toString());

            this.client[method](request, metadata, { deadline }, (error: grpc.ServiceError | null, response: TResponse) => {
                if (error) {
                    this.emit('error', error);
                    reject(error);
                } else {
                    resolve(response);
                }
            });
        });
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        enableRetry: boolean = true
    ): Promise<T> {
        const { maxRetries, retryDelay, retryableStatusCodes } = this.options.retryOptions!;
        let lastError: any;

        for (let attempt = 0; attempt <= maxRetries!; attempt++) {
            try {
                return await operation();
            } catch (error: any) {
                lastError = error;

                if (!enableRetry || attempt === maxRetries) {
                    throw error;
                }

                const isRetryable = retryableStatusCodes!.includes(error.code);
                if (!isRetryable) {
                    throw error;
                }

                this.emit('retry', { attempt: attempt + 1, error });
                await this.sleep(retryDelay! * (attempt + 1)); // Exponential backoff
            }
        }

        throw lastError;
    }

    private async applyInterceptors<T>(
        context: InterceptorContext,
        operation: () => Promise<T>
    ): Promise<T> {
        if (this.interceptors.length === 0) {
            return operation();
        }

        let index = 0;
        const next = async (): Promise<T> => {
            if (index >= this.interceptors.length) {
                return operation();
            }
            const interceptor = this.interceptors[index++];
            return interceptor(context, next);
        };

        return next();
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private monitorConnection(): void {
        if (!this.client) return;

        const channel = this.client.getChannel();
        let lastState = channel.getConnectivityState(false);

        const checkState = () => {
            if (!this.isConnected) return;

            const currentState = channel.getConnectivityState(false);
            if (currentState !== lastState) {
                this.emit('connectionStateChanged', {
                    from: lastState,
                    to: currentState,
                });
                lastState = currentState;

                if (currentState === grpc.connectivityState.SHUTDOWN) {
                    this.isConnected = false;
                    this.emit('disconnected');
                }
            }

            if (this.isConnected) {
                setTimeout(checkState, 5000);
            }
        };

        setTimeout(checkState, 5000);
    }

    async streamRequest<TRequest = any, TResponse = any>(
        method: string,
        requests: TRequest[],
        metadata?: grpc.Metadata
    ): Promise<TResponse> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error('Client not connected. Call connect() first.'));
                return;
            }

            const meta = metadata || new grpc.Metadata();
            const call = this.client[method](meta, (error: grpc.ServiceError | null, response: TResponse) => {
                if (error) {
                    this.emit('error', error);
                    reject(error);
                } else {
                    resolve(response);
                }
            });

            requests.forEach((request) => {
                call.write(request);
            });

            call.end();
        });
    }

    streamResponse<TRequest = any, TResponse = any>(
        method: string,
        request: TRequest,
        metadata?: grpc.Metadata
    ): grpc.ClientReadableStream<TResponse> {
        if (!this.client) {
            throw new Error('Client not connected. Call connect() first.');
        }

        const meta = metadata || new grpc.Metadata();
        const call = this.client[method](request, meta);

        call.on('error', (error: Error) => {
            this.emit('error', error);
        });

        return call;
    }

    bidirectionalStream<TRequest = any, TResponse = any>(
        method: string,
        metadata?: grpc.Metadata
    ): grpc.ClientDuplexStream<TRequest, TResponse> {
        if (!this.client) {
            throw new Error('Client not connected. Call connect() first.');
        }

        const meta = metadata || new grpc.Metadata();
        const call = this.client[method](meta);

        call.on('error', (error: Error) => {
            this.emit('error', error);
        });

        return call;
    }

    getClient(): any {
        return this.client;
    }

    addInterceptor(interceptor: ClientInterceptor): void {
        this.interceptors.push(interceptor);
    }

    getConnectionState(): grpc.connectivityState | null {
        if (!this.client) return null;
        return this.client.getChannel().getConnectivityState(false);
    }

    close(): void {
        if (this.client) {
            this.isConnected = false;
            grpc.closeClient(this.client);
            this.emit('closed');
        }
    }

    waitForReady(deadline: Date | number): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error('Client not connected. Call connect() first.'));
                return;
            }

            this.client.waitForReady(deadline, (error: Error | undefined) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}

export class GrpcServerWrapper extends EventEmitter {
    private readonly server: grpc.Server;
    private readonly options: GrpcServerOptions;
    private packageDefinition: any;
    private proto: any;
    private serviceDefinition: any;
    private interceptors: ServerInterceptor[];
    private healthCheckService: any;
    private isRunning: boolean = false;

    constructor(options: GrpcServerOptions) {
        super();
        this.options = {
            ...options,
            credentials: options.credentials ?? grpc.ServerCredentials.createInsecure(),
            protoLoaderOptions: options.protoLoaderOptions ?? {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            },
            enableHealthCheck: options.enableHealthCheck ?? true,
        };
        
        const serverOptions: any = {};
        if (options.maxConcurrentCalls) {
            serverOptions['grpc.max_concurrent_streams'] = options.maxConcurrentCalls;
        }
        
        this.server = new grpc.Server(serverOptions);
        this.interceptors = options.interceptors || [];
    }

    async loadProto(): Promise<void> {
        try {
            this.packageDefinition = await protoLoader.load(
                this.options.protoPath,
                this.options.protoLoaderOptions
            );

            this.proto = grpc.loadPackageDefinition(this.packageDefinition);

            const packagePath = this.options.packageName.split('.');
            let service = this.proto;
            for (const key of packagePath) {
                service = service[key];
            }

            this.serviceDefinition = service[this.options.serviceName];

            if (!this.serviceDefinition) {
                throw new Error(`Service ${this.options.serviceName} not found in package ${this.options.packageName}`);
            }

            this.emit('protoLoaded');
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    addService(implementation: any): void {
        if (!this.serviceDefinition) {
            throw new Error('Proto not loaded. Call loadProto() first.');
        }

        // Wrap implementation with interceptors
        const wrappedImplementation = this.wrapImplementationWithInterceptors(implementation);
        this.server.addService(this.serviceDefinition.service, wrappedImplementation);
    }

    private wrapImplementationWithInterceptors(implementation: any): any {
        if (this.interceptors.length === 0) {
            return implementation;
        }

        const wrapped: any = {};
        for (const method in implementation) {
            wrapped[method] = (call: any, callback: any) => {
                let index = 0;
                const next = () => {
                    if (index >= this.interceptors.length) {
                        implementation[method](call, callback);
                        return;
                    }
                    const interceptor = this.interceptors[index++];
                    interceptor(call, callback, next);
                };
                next();
            };
        }
        return wrapped;
    }

    addInterceptor(interceptor: ServerInterceptor): void {
        this.interceptors.push(interceptor);
    }

    private setupHealthCheck(): void {
        if (!this.options.enableHealthCheck) return;

        // Basic health check implementation
        this.healthCheckService = {
            check: (call: any, callback: any) => {
                callback(null, {
                    status: this.isRunning ? 'SERVING' : 'NOT_SERVING',
                });
            },
            watch: (call: any) => {
                // Stream health status
                const sendStatus = () => {
                    call.write({
                        status: this.isRunning ? 'SERVING' : 'NOT_SERVING',
                    });
                };
                sendStatus();
                const interval = setInterval(sendStatus, 5000);
                call.on('cancelled', () => clearInterval(interval));
            },
        };
    }

    async start(): Promise<void> {
        return new Promise((resolve, reject) => {
            const address = `${this.options.host}:${this.options.port}`;

            this.setupHealthCheck();

            this.server.bindAsync(
                address,
                this.options.credentials || grpc.ServerCredentials.createInsecure(),
                (error: Error | null, port: number) => {
                    if (error) {
                        this.emit('error', error);
                        reject(error);
                    } else {
                        this.server.start();
                        this.isRunning = true;
                        this.emit('started', { address, port });
                        resolve();
                    }
                }
            );
        });
    }

    async stop(): Promise<void> {
        return new Promise((resolve) => {
            this.isRunning = false;
            this.server.tryShutdown(() => {
                this.emit('stopped');
                resolve();
            });
        });
    }

    forceStop(): void {
        this.isRunning = false;
        this.server.forceShutdown();
        this.emit('forceStopped');
    }

    getHealthStatus(): { isRunning: boolean; status: string } {
        return {
            isRunning: this.isRunning,
            status: this.isRunning ? 'SERVING' : 'NOT_SERVING',
        };
    }

    getServer(): grpc.Server {
        return this.server;
    }
}

export default {
    GrpcClientWrapper,
    GrpcServerWrapper,
};