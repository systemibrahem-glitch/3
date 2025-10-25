import { createTRPCReact } from "@trpc/react-query";

// Mock router type for development
type MockRouter = {
  auth: {
    me: {
      useQuery: () => {
        data: any;
        isLoading: boolean;
        error: any;
        refetch: () => Promise<any>;
      }
    }
  }
};

export const trpc = createTRPCReact<MockRouter>();
