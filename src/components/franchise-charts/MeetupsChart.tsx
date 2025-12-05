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

interface MeetupsDataPoint {
  date: string;
  count: number;
}

interface MeetupsChartProps {
  data: MeetupsDataPoint[];
  title?: string;
}

const MeetupsChart: React.FC<MeetupsChartProps> = ({
  data,
  title = "Meetups Count",
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
              label={{ value: "(no of meetups)", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="rect"
            />
            <Bar
              dataKey="count"
              name="Meetups"
              fill="#667eea"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default MeetupsChart;
