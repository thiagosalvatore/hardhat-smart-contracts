import React from "react";
import Button from "@mui/material/Button";
import { Grid, TextField, Typography } from "@mui/material";
import { useFundMe } from "./hooks/useFundMe";

function App() {
    const {
        state,
        fund,
        withdraw,
        connectMetamaskAccount,
        getBalance,
        updateEthAmount,
    } = useFundMe();

    if (!window.ethereum) {
        return <div>Metamask not configured in your browser</div>;
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={3}>
                <Button
                    variant="contained"
                    onClick={connectMetamaskAccount}
                    disabled={state.connected}
                    fullWidth={true}
                >
                    {state.connected
                        ? "Metamask Connected"
                        : "Connect Metamask Wallet"}
                </Button>
            </Grid>
            <Grid item xs={3}>
                <Button
                    variant="contained"
                    onClick={getBalance}
                    fullWidth={true}
                >
                    Refresh Balance
                </Button>
            </Grid>
            <Grid item xs={3}>
                <Button variant="contained" onClick={withdraw} fullWidth={true}>
                    Withdraw
                </Button>
            </Grid>
            <Grid item xs={12}>
                <Typography variant="h4">
                    Current Balance:{" "}
                    {state.currentBalance !== null
                        ? state.currentBalance
                        : "N/A"}
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <form onSubmit={fund}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                            <TextField
                                fullWidth={true}
                                label="ETH amount"
                                variant="outlined"
                                name="eth_amount"
                                required={true}
                                onChange={(e) =>
                                    updateEthAmount(e.target.value)
                                }
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Button variant="contained" type="submit">
                                Fund
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Grid>
        </Grid>
    );
}

export default App;
