export const config = {
  apiUrl: import.meta.env.VITE_API_URL as string,
  wsUrl: import.meta.env.VITE_WS_URL as string,
  appName: import.meta.env.VITE_APP_NAME as string,
} as const;
