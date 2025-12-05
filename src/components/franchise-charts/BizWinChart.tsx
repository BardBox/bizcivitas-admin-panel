import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

interface BizWinDataPoint {
  date: string;
  given: number;
  received: number;
}

interface BizWinChartProps {
  data: BizWinDataPoint[];
  title?: string;
}

// Currency formatting helper
const formatCurrency = (value: number): string => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`;
  } else if (value >= 1000) {
    return `₹${(value / 1000).toFixed(2)}K`;
  }
  return `₹${value}`;
};

const BizWinChart: React.FC<BizWinChartProps> = ({
  data,
  title = "BizWin (TYFCB) - Given vs Received",
}) => {
  return (
    <Paper sx={{ p: 3, height: "100%" }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Box sx={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              angle={-45}
              textAnchor="end"
              height={80}
              style={{ fontSize: "12px" }}
            />
            <YAxis
              style={{ fontSize: "12px" }}
              label={{ value: "Amount (INR)", angle: -90, position: "insideLeft" }}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
              formatter={(value: number) => [formatCurrency(value), ""]}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="rect"
            />
            <Bar
              dataKey="given"
              name="BizWin Given"
              fill="#3359FF"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="received"
              name="BizWin Received"
              fill="#1DB212"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default BizWinChart;
