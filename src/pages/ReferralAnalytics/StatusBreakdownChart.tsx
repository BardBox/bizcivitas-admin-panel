import { Box, Card, CardContent, Typography, Grid } from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface StatusBreakdownChartProps {
  data: StatusData[];
}

export default function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Invite Status Distribution
        </Typography>
        {data.length > 0 ? (
          <Box sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Status Summary Cards */}
            <Grid container spacing={1} mt={2}>
              {data.map((item, index) => (
                <Grid item xs={6} key={index}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      backgroundColor: `${item.color}15`,
                      border: `2px solid ${item.color}`,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold" color={item.color}>
                      {item.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      {item.name}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        ) : (
          <Typography color="text.secondary" align="center" py={5}>
            No data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
