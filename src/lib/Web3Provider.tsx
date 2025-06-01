
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, optimism, optimismSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

// Environment variables - move these to Supabase secrets before going public
const REACT_PUBLIC_WALLETCONNCT_PROJECT_ID = process.env.REACT_PUBLIC_WALLETCONNCT_PROJECT_ID;
const REACT_PUBLIC_ALCHEMY_ID = process.env.REACT_PUBLIC_ALCHEMY_ID;
const REACT_PUBLIC_OP_MAINNET_RPC = "https://mainnet.optimism.io";
const REACT_PUBLIC_LH_API_KEY = process.env.REACT_PUBLIC_LH_API_KEY;

// Contract addresses for both networks
export const CONTRACT_ADDRESSES = {
  [optimism.id]: "0x1b99E303b9A1D8279F45Bb6e510863fB669cDf65", // OP Mainnet
  [optimismSepolia.id]: "0xcaD1561c501eAAB2a44FD257b465b43D888b5b45" // OP Sepolia
} as const;

// Pyth Entropy addresses (example addresses - replace with actual)
export const PYTH_ENTROPY_ADDRESSES = {
  [optimism.id]: "0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF", // OP Mainnet
  [optimismSepolia.id]: "0x4374e5a8b9C22271E9EB878A2AA31DE97DF15DAF" // OP Sepolia
} as const;

export const config = createConfig(
  getDefaultConfig({
    // Your dApps chains - now supporting both OP networks
    chains: [optimism, optimismSepolia],
    transports: {
      // RPC URL for each chain
      [optimism.id]: http(REACT_PUBLIC_OP_MAINNET_RPC),
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
