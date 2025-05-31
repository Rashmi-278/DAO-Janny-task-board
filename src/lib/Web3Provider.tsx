
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, optimismSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// Environment variables - move these to Supabase secrets before going public
const REACT_PUBLIC_WALLETCONNCT_PROJECT_ID = "a88dc486e89aa2620b970e5c80f8e7e6";
const REACT_PUBLIC_ALCHEMY_ID = "https://opt-sepolia.g.alchemy.com/v2/exFlRA7r_UeLVbAJExOA2-ZI0SrUFmcm";
const REACT_PUBLIC_LH_API_KEY = "f16b5a44.24bd5c619e0648fdab2cbdfde9983f7c";

const config = createConfig(
  getDefaultConfig({
    // Your dApps chains
    chains: [optimismSepolia],
    transports: {
      // RPC URL for each chain
      [optimismSepolia.id]: http(REACT_PUBLIC_ALCHEMY_ID),
    },

    // Required API Keys
    walletConnectProjectId: REACT_PUBLIC_WALLETCONNCT_PROJECT_ID,

    // Required App Info
    appName: "DAO Janny",

    // Optional App Info
    appDescription: "DAO Task Management and Proposal Execution Board",
    appUrl: "https://family.co", // your app's url
    appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  }),
);

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

// Export the API keys for use in other parts of the application
export { REACT_PUBLIC_LH_API_KEY };
