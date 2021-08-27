import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import Pagination from "./pagination";
import CardInfo from "./cardinfo";

import { BingoCard } from "../types";
import ApiRender from "../api/render";
import api from "../api/backend";
import { Header } from "../components/snippets";
import { useAuth } from "../auth";
import { PopularCategoriesSidebar } from "../components/sidebar";

interface CardListProps {
    query?: object;
    key: string;
    home?: boolean;
}

const CardList = ({ home, query = {}, key }: CardListProps) => {
    const { user } = useAuth();
    const location = useLocation();
    const apiCall = home && user ? api.getHomeCards : api.getCardList;

    return <ApiRender apiCall={() => apiCall(location, query)} component={CardLayout} key={key} />;
};

interface CardResults {
    count: number;
    page_size: number;
    results: BingoCard[];
}

const CardLayout = ({ data }: { data: CardResults }) => {
    const PaginationThing = ({ header }: { header?: boolean }) => (
        <div className="p-2">
            <Pagination itemCount={data.count} pageSize={data.page_size} label="cards" top={header} />
        </div>
    );

    //  row-cols-lg-2
    return data.count === 0 ? (
        <Row>
            <Col className="p-2">
                <div className="rounded p-4 sdark-fg text-center">
                    <h3>No results found.</h3>
                </div>
            </Col>
        </Row>
    ) : (
        <>
            <PaginationThing header />
            <Row className="row-cols-1">
                {data.results.map((card) => (
                    <Col className="p-2">
                        <CardInfo card={card} link />
                    </Col>
                ))}
            </Row>
            <PaginationThing />
        </>
    );
};

export default CardList;

interface CardListSidebarProps {
    header?: ReactNode;
    query?: object;
    home?: boolean;
    infoCol?: ReactNode;
    sidebarCol?: ReactNode;
}

export const CardListSidebar = ({ header, query, home, infoCol, sidebarCol }: CardListSidebarProps) => {
    return (
        <>
            {header}

            <div className="py-2">
                <Container>
                    <Row>
                        <Col xs={12} lg={8}>
                            {infoCol}
                            <CardList query={query} home={home} key={`${Date.now()}`} />
                        </Col>
                        <Col xs={4} className="d-none d-lg-block">
                            {sidebarCol}
                            <PopularCategoriesSidebar />
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
};
