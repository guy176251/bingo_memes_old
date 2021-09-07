import { Link } from "react-router-dom";
import Nav from "react-bootstrap/Nav";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import api from "../api/backend";
import ApiRender from "../api/render";
import { Category, SearchResults } from "../types";
import { CategoryList } from "../components/snippets";
import "../scss/sidebar.scss";

const Sidebar = () => {
    return (
        <>
            <div className="py-2"></div>
            <Nav
                className="col d-block bg-transparent sidebar"
                activeKey="/home"
                onSelect={(selectedKey) => alert(`selected ${selectedKey}`)}
            >
                <div className="sidebar-sticky"></div>
                {Array(4)
                    .fill(0)
                    .map((_, index) => (
                        <Nav.Item className="rounded-pill mb-3 sdark-fg text-light">
                            <Nav.Link eventKey={`link-${index}`}>Link {index}</Nav.Link>
                        </Nav.Item>
                    ))}
            </Nav>
        </>
    );
};

export const PopularCategoriesSidebar = () => {
    return (
        <ApiRender
            key="popular-categories"
            apiCall={() => api.getPopularCategories()}
            component={({ data }: { data: SearchResults<Category> }) => (
                <>
                    <Col xs={12}>
                        <div className="rounded sdark-fg p-3">
                            <Row>
                                <Col>
                                    <h4 className="mb-4">Popular Categories</h4>
                                </Col>
                            </Row>
                            <Row>
                                <CategoryList categories={data.results} />
                            </Row>
                        </div>
                    </Col>
                    <Col xs={12}>
                        <div className="rounded sdark-fg p-3">
                            <h4 className="mb-4">Links</h4>
                            {[
                                ["One", "Two"],
                                ["Three", "Four"],
                            ].map((row) => (
                                <Row>
                                    {row.map((label) => (
                                        <Col>
                                            <Link to="/">{label}</Link>
                                        </Col>
                                    ))}
                                </Row>
                            ))}
                        </div>
                    </Col>
                </>
            )}
        />
    );
};
