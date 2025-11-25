import React, {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

// Define the type for the context
type LoadingContextType = {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
};

// Create the context with default values
const LoadingContext = createContext<LoadingContextType>({
  isLoading: false, // Default loading state
  setIsLoading: () => {},
});

// Custom hook to use the loading context
export const useLoadingContext = () => useContext(LoadingContext);

// LoadingProvider to wrap around your app/component
export const LoadingProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false); // State to manage loading

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
