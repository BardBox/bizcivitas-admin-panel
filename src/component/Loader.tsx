import CircularProgress from "@mui/material/CircularProgress";
import { Backdrop } from "@mui/material";
import { useEffect, useState } from "react";

const colors = ["#305dfb", "#2bb225", "#e5890a"]; // Colors from your BarChart

const Loader = ({ loading }: { loading: boolean }) => {
  const [currentColor, setCurrentColor] = useState(colors[0]);

  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        setCurrentColor(colors[index]);
        index = (index + 1) % colors.length; // Cycle through colors
      }, 800); // Change color every 800ms

      return () => clearInterval(interval); // Cleanup on unmount
    }
  }, [loading]);

  if (!loading) return null;

  return (
    <Backdrop
      open={loading}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
    >
      <CircularProgress sx={{ color: currentColor }} size={80} />
    </Backdrop>
  );
};

export default Loader;
