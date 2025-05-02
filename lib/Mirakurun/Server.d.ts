declare class Server {
    private _isRunning;
    private _servers;
    private _rpcs;
    init(): Promise<void>;
}
export default Server;
