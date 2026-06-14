declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URI: string;
    PORT: string;
    JWT_SECRET: string;
    JWT_EXPIRE?: string;
    FRONTEND_URL: string;
    OLLAMA_URL: string;
    OLLAMA_MODEL: string;
    OLLAMA_TIMEOUT: string;
    NODE_ENV: 'development' | 'production' | 'test';
    REDIS_URL?: string;
    REDIS_PASSWORD?: string;
    REDIS_DB?: string;
    LOG_LEVEL?: string;
  }
}
