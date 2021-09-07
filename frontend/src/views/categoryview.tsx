import { useParams, useLocation, useHistory } from "react-router-dom";
import { Helmet } from "react-helmet";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Button from "react-bootstrap/Button";
import { FontAwesomeIcon as FaIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

import ApiRender from "../api/render";
import api from "../api/backend";
import { Category } from "../types";
import { CardListSidebar } from "../components/cardlist";
import { CategoryList, SubscribeButton, HashtagButton } from "../components/snippets";
import { dateStr } from "../components/helpers";

const CategoryView = () => {
    const { categoryName }: { categoryName: string } = useParams();

    return <ApiRender apiCall={() => api.getCategory(categoryName)} component={CategoryHeader} key={categoryName} />;
};

//const bannerImg =
//    "https://yt3.ggpht.com/Cxw4AarF_wX_PqgBJ-BsK6C_toAsxVAyGnsHJFssO9D7B3H2LS4xq1a7p0VSV-GstyLxPEOR5g=w1707-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj";
//const iconImg = "https://yt3.ggpht.com/ytc/AKedOLQFVN7wLaJFbdPU56qOkNlbkrMneYpTmGpneRig=s88-c-k-c0x00ffffff-no-rj-mo";
//const iconImg = "https://i.ytimg.com/vi/MPV2METPeJU/maxresdefault.jpg";

//const subCount = (num: number) => `${num} Subscriber${num === 1 ? "" : "s"}`;

const CategoryHeader = ({ data }: { data: Category }) => {
    const searchParams = new URLSearchParams(useLocation().search);
    const history = useHistory();
    const hashtag = searchParams.get("hashtag");
    const hashtagParams = hashtag ? { hashtag: encodeURIComponent(hashtag) } : {};

    const TopIcon = ({ bottom }: { bottom: string }) => (
        <div
            className="rounded-circle p-2 sdark-fg"
            style={{
                position: "absolute",
                bottom: bottom,
                width: "100px",
                height: "100px",
            }}
        >
            <img src={data.icon_url} alt="" className="rounded-circle img-fluid w-100 h-100" />
        </div>
    );

    const Header = () => (
        <>
            <div
                className="banner"
                style={{
                    backgroundImage: `url("${data.banner_url}")`,
                }}
            ></div>

            <Navbar className="sdark-fg p-3" variant="dark">
                <Container>
                    <Row>
                        {/* Column with category icon and buttons */}
                        <Col xs={12}>
                            <Nav>
                                <Nav.Item id="mobile-icon" className="d-lg-none">
                                    <TopIcon bottom="54px" />
                                </Nav.Item>
                                <Nav.Item id="desktop-icon" className="d-none d-lg-block">
                                    <TopIcon bottom="10px" />
                                </Nav.Item>
                                <Nav.Item style={{ marginLeft: "120px" }}></Nav.Item>
                                <Nav.Item className="pe-4 d-none d-lg-block">
                                    <Col className="p-0">
                                        <h2 className="m-0">{data.name}</h2>
                                        {/*
                                        <div>{subCount(data.subscribers)}</div>
                                        */}
                                    </Col>
                                </Nav.Item>
                                <Nav.Item className="pe-2">
                                    <SubscribeButton
                                        subbed={data.is_subscribed}
                                        apiCall={() => api.createSubscription({ id: data.id })}
                                    />
                                </Nav.Item>
                                <Nav.Item>
                                    <Button
                                        variant="warning"
                                        onClick={() => history.push(`/categories/${data.name}/create/`)}
                                        className="text-white rounded-pill"
                                    >
                                        New
                                    </Button>
                                </Nav.Item>
                                {hashtag && (
                                    <Nav.Item className="ps-2">
                                        <Button
                                            onClick={() => history.push(`/categories/${data.name}/`)}
                                            variant="primary"
                                            className="text-white rounded-pill"
                                        >
                                            #{hashtag}
                                            <FaIcon icon={faTimes} className="ms-3" />
                                        </Button>
                                    </Nav.Item>
                                )}
                            </Nav>
                        </Col>
                        {/* Info/mobile-collapse column */}
                        <Col xs={12}>
                            <Nav className="d-lg-none">
                                <Nav.Item className={`mt-3 ${data.name.length > 14 ? "" : "mx-2"}`}>
                                    <Col className="p-0">
                                        {data.name.length > 14 ? (
                                            <h3 className="m-0">{data.name}</h3>
                                        ) : (
                                            <h2 className="m-0">{data.name}</h2>
                                        )}
                                        {/*
                                        <div>{subCount(data.subscribers)}</div>
                                        */}
                                    </Col>
                                </Nav.Item>
                                {/*
                                <NavItem>
                                    <SubscribeButton
                                        subbed={data.subscribed}
                                        apiCall={() => api.createSubscription({ category: { id: data.id } })}
                                    />
                                </NavItem>
                                */}
                            </Nav>
                            {/*
                            <p className="m-0 mx-2 mt-4">
                                Elit sit impedit velit temporibus eligendi. Distinctio non repellat asperiores?
                            </p>
                            */}
                        </Col>
                    </Row>
                </Container>
            </Navbar>
        </>
    );

    const Sidebar = () => (
        <>
            <Col xs={12}>
                <div className="p-3 sdark-fg rounded">
                    <div className="text-center">
                        <h4 className="mb-4">About {data.name}</h4>
                    </div>
                    {/*
                    <p className="mb-3">{data.subscriber_count} Subscribers</p>
                    <p className="mb-3">Created on {dateStr(data.created_at)}</p>
                */}
                    <p className="mb-4">{data.description}</p>
                    <Row>
                        <Col>
                            <b>Subscribers</b>
                            <p>{data.subscriber_count}</p>
                        </Col>
                        <Col>
                            <b>Created At</b>
                            <p>{dateStr(data.created_at)}</p>
                        </Col>
                    </Row>
                </div>
            </Col>
            <Col xs={12}>
                <div className="p-3 sdark-fg rounded">
                    <h4 className="mb-4">Popular hashtags</h4>
                    <div className="d-flex flex-wrap">
                        {data.hashtags.map((hashtag) => (
                            <div className="me-2 mb-2">
                                <HashtagButton category={data} name={hashtag.name} />
                            </div>
                        ))}
                    </div>
                </div>
            </Col>
            <Col xs={12}>
                <div className="p-3 sdark-fg rounded">
                    <Row>
                        <Col>
                            <h4 className="mb-4">Related Categories</h4>
                        </Col>
                    </Row>
                    <Row>
                        <CategoryList categories={data.related_categories} />
                    </Row>
                </div>
            </Col>
        </>
    );

    return (
        <>
            <Helmet>
                <title>{data.name}</title>
            </Helmet>

            <CardListSidebar
                header={<Header />}
                sidebarCol={<Sidebar />}
                query={{ ...hashtagParams, category: data.name }}
            />
        </>
    );
};
export default CategoryView;
