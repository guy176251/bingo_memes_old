import { Link, useParams } from 'react-router-dom';

import ApiRender from '../api/render';
import api from '../api/backend';
import { Category } from '../types';
import CardList from '../components/cardlist';
import { InfoHeader, parseDate } from '../components/snippets';

const CategoryView = () => {
    const { categoryName }: { categoryName: string } = useParams();

    return (
        <ApiRender
            apiCall={() => api.getCategory(categoryName)}
            component={CategoryHeader}
            key={categoryName}
        />
    );
}

const CategoryHeader = ({ data }: { data: Category }) => (
    <>
        <InfoHeader
            subject={`category: ${data.name}`}
            info={[
                <>author: <Link to={`/users/${data.author.id}/`}>{data.author.name}</Link></>,
                `created at ${parseDate(data.created_at)}`,
            ]}
        />
        <CardList query={{ category: data.name }}/>
    </>
);

export default CategoryView;
