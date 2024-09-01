import React from 'react'
import { Header } from "@/components/layout";
import { ApiLoader } from "@/components";
import { useAccount, useApi } from "@gear-js/react-hooks";
import { Outlet } from 'react-router-dom'


export const Root = () => {
    const { isApiReady } = useApi();
    const { isAccountReady } = useAccount();

    const isAppReady = isApiReady && isAccountReady;

    return (
        <>
            <Header isAccountVisible={isAccountReady}/>
            {isAppReady ? <Outlet /> : <ApiLoader />}
        </>
    )
}
