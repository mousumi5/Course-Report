
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

interface Window {
  process: {
    env: {
      API_KEY: string;
    };
  };
}
