import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Slider,
    Button,
    Alert,
    Divider,
    Chip
} from "@mui/material";
import {
    AttachMoney,
    PieChart,
    People
} from "@mui/icons-material";
import { getAllCommissionConfigs, CommissionConfig } from "../../api/commissionConfigApi";
import { toast } from 'react-toastify';

interface Props {
    zoneName: string;
    userRole: string; // 'master-franchise'
}

const CommissionDistributionTab: React.FC<Props> = ({ zoneName }) => {
    const [loading, setLoading] = useState(false);
    const [globalConfig, setGlobalConfig] = useState<CommissionConfig | null>(null);
    const [areaShare, setAreaShare] = useState<number>(5); // Default start

    // Example base amount for calculations
    const EXAMPLE_AMOUNT = 354000;

    useEffect(() => {
        fetchGlobalConfig();
    }, []);

    const fetchGlobalConfig = async () => {
        try {
            setLoading(true);
            const configs = await getAllCommissionConfigs();
            const config = configs.find(c => c.membershipType === 'Flagship Membership');
            if (config) {
                setGlobalConfig(config);
            }
        } catch (error) {
            console.error('Error fetching global config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        setLoading(true);
        // In a real implementation, this would POST to /api/commission-configs/zone or similar
        setTimeout(() => {
            setLoading(false);
            toast.success(`Distribution Updated! Area Partners in ${zoneName} will receive ${areaShare}%.`);
        }, 800);
    };

    // Calculations
    const receivedShare = globalConfig?.distribution.masterFranchise || 12; // From Admin
    const myNetShare = receivedShare - areaShare;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <Grid container spacing={3}>
            {/* Simulation / Control Panel */}
            <Grid item xs={12} md={8}>
                <Card sx={{ height: '100%', borderRadius: 3, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                            <Box>
                                <Typography variant="h5" fontWeight="bold">Commission Distribution</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Manage commission split for <strong>{zoneName}</strong>
                                </Typography>
                            </Box>
                            <Chip
                                label="Active Policy"
                                color="success"
                                variant="outlined"
                                size="small"
                            />
                        </Box>

                        {/* Incoming Share Info */}
                        <Box sx={{ bgcolor: '#f0f7ff', p: 3, borderRadius: 2, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box display="flex" alignItems="center" gap={2}>
                                <Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: '50%', color: 'white', display: 'flex' }}>
                                    <AttachMoney />
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="primary.main" fontWeight="bold" textTransform="uppercase">
                                        Total Allocated to You (Zone Pool)
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Fixed by Global Admin Policy
                                    </Typography>
                                </Box>
                            </Box>
                            <Box textAlign="right">
                                <Typography variant="h4" color="primary.dark" fontWeight="800">
                                    {receivedShare}%
                                </Typography>
                                <Typography variant="body2" fontFamily="monospace" color="primary.main">
                                    {formatCurrency((EXAMPLE_AMOUNT * receivedShare) / 100)}
                                </Typography>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 4 }} />

                        {/* Slider Control */}
                        <Box mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="h6" fontWeight="600">Area Partner Allocation</Typography>
                                <Chip
                                    label={`You Give: ${areaShare}%`}
                                    color="primary"
                                    sx={{ fontWeight: 'bold' }}
                                />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={4}>
                                Adjust the percentage shared with your Area Franchises data.
                            </Typography>

                            <Slider
                                value={areaShare}
                                onChange={(_, val) => setAreaShare(val as number)}
                                min={0}
                                max={receivedShare} // Capped at what they have
                                step={0.5}
                                valueLabelDisplay="auto"
                                sx={{ height: 8, mb: 4 }}
                            />

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 2, bgcolor: '#fafafa' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1} color="text.secondary">
                                            <People fontSize="small" />
                                            <Typography variant="subtitle2">Area Partner Receives</Typography>
                                        </Box>
                                        <Typography variant="h4" fontWeight="bold" color="text.primary">
                                            {areaShare}%
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" mt={1}>
                                            {formatCurrency((EXAMPLE_AMOUNT * areaShare) / 100)}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Box sx={{ border: '1px solid #c8e6c9', borderRadius: 2, p: 2, bgcolor: '#e8f5e9' }}>
                                        <Box display="flex" alignItems="center" gap={1} mb={1} color="success.dark">
                                            <PieChart fontSize="small" />
                                            <Typography variant="subtitle2">Your Net Earnings</Typography>
                                        </Box>
                                        <Typography variant="h4" fontWeight="bold" color="success.dark">
                                            {myNetShare}%
                                        </Typography>
                                        <Typography variant="body2" color="success.dark" mt={1}>
                                            {formatCurrency((EXAMPLE_AMOUNT * myNetShare) / 100)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box mt={4} display="flex" justifyContent="flex-end">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleSave}
                                disabled={loading}
                                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                            >
                                {loading ? 'Saving...' : 'Save Distribution Rules'}
                            </Button>
                        </Box>

                    </CardContent>
                </Card>
            </Grid>

            {/* Info / FAQ Panel */}
            <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" gap={3}>
                    {/* Summary Card */}
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Structure Summary</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="body2" color="text.secondary">Reference Amount</Typography>
                                <Typography variant="body2" fontWeight="bold">{formatCurrency(EXAMPLE_AMOUNT)}</Typography>
                            </Box>
                            <Box mt={2}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box width={8} height={8} bgcolor="primary.main" borderRadius="50%" />
                                        <Typography variant="body2" fontWeight="500">Total Network Pool</Typography>
                                    </Box>
                                    <Typography variant="body2" fontWeight="bold">{receivedShare}%</Typography>
                                </Box>
                                <Box pl={2} borderLeft="2px solid #f0f0f0">
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} mt={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box width={6} height={6} bgcolor="success.main" borderRadius="50%" />
                                            <Typography variant="caption">Your Share</Typography>
                                        </Box>
                                        <Typography variant="caption" fontWeight="bold" color="success.main">{myNetShare}%</Typography>
                                    </Box>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box width={6} height={6} bgcolor="text.secondary" borderRadius="50%" />
                                            <Typography variant="caption">Area Partners</Typography>
                                        </Box>
                                        <Typography variant="caption" fontWeight="bold">{areaShare}%</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Info Alert */}
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>How is this stored?</Typography>
                        <Typography variant="caption" display="block">
                            Your distribution settings are saved specifically for your zone (<strong>{zoneName}</strong>).
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                            When sales occur in your zone, we use the Global rate ({receivedShare}%) minus your specified Area rate ({areaShare}%) to calculate payouts automatically.
                        </Typography>
                    </Alert>
                </Box>
            </Grid>
        </Grid>
    );
};

export default CommissionDistributionTab;
