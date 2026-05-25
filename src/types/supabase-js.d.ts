declare module '@supabase/supabase-js' {
  export type FunctionsInvokeResponse<T> = {
    data: T | null;
    error: { message?: string } | null;
  };

  export type SupabaseClient = {
    functions: {
      invoke<T = unknown>(
        functionName: string,
        options?: { body?: unknown },
      ): Promise<FunctionsInvokeResponse<T>>;
    };
  };

  export function createClient(url: string, key: string): SupabaseClient;
}
