import { useLocation } from 'react-router-dom';

import Pagination from './pagination';
import CardInfo from './cardinfo';

import { BingoCard } from '../types';
import ApiRender from '../api/render';
import api from '../api/backend';
import { Header } from '../components/snippets';

interface CardListProps {
    query: object;
}

const CardList = ({ query }: CardListProps) => {
    let location = useLocation();

    return (
        <ApiRender
            apiCall={() => api.getCardList(location, query)}
            component={CardLayout}
        />
    );
}

interface CardResults {
    count: number;
    page_size: number;
    results: BingoCard[];
}

const CardLayout = ({ data }: { data: CardResults }) => {

    const PaginationThing = ({ header }: { header?: boolean }) =>
        <div className="p-2">
            <Pagination
                itemCount={data.count}
                pageSize={data.page_size}
                label='cards'
                header={header}
            />
        </div>;

    return (
        data.count === 0
            ?
                <Header card>
                    <h3>No results found.</h3>
                </Header>
            :
                <>
                    <PaginationThing header />
                    <div className='row row-cols-1 row-cols-lg-2'>
                        {data.results.map(card => (
                            <div className="col p-2">
                                <CardInfo card={card} link/>    
                            </div>
                        ))}
                    </div>
                    <PaginationThing />
                </>
    );
};

export default CardList;
