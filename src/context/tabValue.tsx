import React, {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
  ReactNode,
} from "react";

type ContextType = {
  value: number;
  setValue: Dispatch<SetStateAction<number>>;
};

const TabValueContext = createContext<ContextType>({
  value: 0,
  setValue: () => {},
});

export const useTabValueContext = () => useContext(TabValueContext);

export const TabValueProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [value, setValue] = useState<number>(0);

  return (
    <TabValueContext.Provider value={{ value, setValue }}>
      {children}
    </TabValueContext.Provider>
  );
};
