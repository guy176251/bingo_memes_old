import { Helmet } from "react-helmet";
import { CardListSidebar } from "../components/cardlist";

/*
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Link, useParams } from "react-router-dom";
*/

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
