import React from "react";
import Header from "./Header";

type Props = { children: React.ReactNode };

const AppLayout: React.FC<Props> = ({ children }) => {
    return (
        <>
            <Header />
            <main className="app-main">{children}</main>
        </>
    );
};

export default AppLayout;
