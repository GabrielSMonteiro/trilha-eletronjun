import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface CompletionRateChartProps {
  completed: number;
  total: number;
}

export const CompletionRateChart = ({ completed, total }: CompletionRateChartProps) => {
  const data = [
    { name: 'Completadas', value: completed },
    { name: 'Pendentes', value: total - completed },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Taxa de Conclusão</CardTitle>
        <CardDescription>
          {completed} de {total} lições completadas ({Math.round((completed / total) * 100)}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
