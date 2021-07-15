import { useParams } from 'react-router-dom';
import { Helmet } from "react-helmet";

//import { UserAuthContext } from '../context';
import { User } from '../types';
import ApiRender from '../api/render';
import api from '../api/backend';
import CardList from '../components/cardlist';
import { InfoHeader, parseDate } from '../components/snippets';

interface UserId { userId: string };

const UserView = () => {
    //const user = useContext(UserAuthContext);
    const { userId } = useParams<UserId>();

    return (
        <ApiRender
            apiCall={() => api.getUser(userId)}
            component={UserHeader}
            key={userId}
        />
    );
}

const UserHeader = ({ data }: { data: User }) => (
    <>
        <Helmet>
            <title>Profile for {data.name}</title>
        </Helmet>
        <InfoHeader
            subject={`user: ${data.name}`}
            info={[
                `score: ${data.score}`,
                `created at ${parseDate(data.created_at)}`,
            ]}
        />
        <CardList query={{ user: data.id }} key={`${data.id}`}/>
    </>
);

export default UserView;
