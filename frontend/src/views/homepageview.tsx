import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import ApiRender from "../api/render";
import api from "../api/backend";
import { BingoCard, Category } from "../types";
import { CardListSidebar } from "../components/cardlist";
import { Header, parseDate } from "../components/snippets";
import debugLog from "../debug";

const HomePageView = () => {
    return (
        <>
            <Helmet>
                <title>Home</title>
            </Helmet>
            <CardListSidebar home header={<></>} />
        </>
    );
};

export default HomePageView;
