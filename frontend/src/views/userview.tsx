import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown } from "@fortawesome/free-solid-svg-icons";

import { User } from "../types";
import ApiRender from "../api/render";
import api from "../api/backend";
import { CardListSidebar } from "../components/cardlist";
import { CategoryList, parseDate } from "../components/snippets";

interface UserId {
    userId: string;
}

const UserView = () => {
    const { userId } = useParams<UserId>();

    return <ApiRender apiCall={() => api.getUser(userId)} component={UserHeader} key={userId} />;
};

const UserHeader = ({ data }: { data: User }) => (
    <>
        <Helmet>
            <title>overview of {data.name}</title>
        </Helmet>

        <CardListSidebar
            query={{ user: data.id }}
            infoCol={
                <Row className="p-2">
                    <Col>
                        <div className="text-center">
                            <h4 className="my-2">cards created by {data.name}</h4>
                        </div>
                    </Col>
                </Row>
            }
            sidebarCol={
                <>
                    <Row className="p-2">
                        <Col>
                            <Row>
                                <Col className="bg-primary p-3 rounded-top" style={{ height: "50px" }}></Col>
                            </Row>
                            <Row>
                                <Col className="sdark-fg p-3 rounded-bottom">
                                    <div className="text-center">
                                        <h3 className="mb-4">{data.name}</h3>
                                    </div>
                                    <Row>
                                        <Col>
                                            <b>Score</b>
                                            <p className={data.score >= 0 ? "text-sdark-orange" : "text-sdark-violet"}>
                                                <div className="me-3">
                                                    <FaIcon icon={data.score >= 0 ? faArrowUp : faArrowDown} />{" "}
                                                    {data.score}
                                                </div>
                                            </p>
                                        </Col>
                                        <Col>
                                            <b>Created At</b>
                                            <p>{parseDate(data.created_at)}</p>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col></Col>
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    {data.categories_created.length > 0 && (
                        <Row className="p-2">
                            <Col className="rounded sdark-fg py-3">
                                <h4 className="mb-4">Categories Created</h4>
                                <Row>
                                    <CategoryList categories={data.categories_created} />
                                </Row>
                            </Col>
                        </Row>
                    )}
                </>
            }
        />
    </>
);

export default UserView;
