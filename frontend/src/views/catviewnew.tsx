import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";

import api from "../api/backend";
import { Category } from "../types";
import { InfoHeader } from "../components/snippets";
import { dateStr } from "../components/helpers";
import CardListView from "../components/cardlistview";

const CategoryView = () => {
    const { categoryName }: { categoryName: string } = useParams();

    return (
        <CardListView
            apiCall={() => api.getCategory(categoryName)}
            cardQuery={{ category: categoryName }}
            header={CategoryHeader}
            key={`${Date.now()}`}
        />
    );
};

const CategoryHeader = ({ data }: { data: Category }) => (
    <>
        <Helmet>
            <title>{data.name}</title>
            <meta name="description" content={`Category: ${data.name}`} />
        </Helmet>
        <InfoHeader
            subject={`category: ${data.name}`}
            info={[
                <>
                    author: <Link to={`/users/${data.author.id}/`}>{data.author.name}</Link>
                </>,
                `created at ${dateStr(data.created_at)}`,
            ]}
        />
    </>
);

export default CategoryView;
