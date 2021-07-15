import { useReducer, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/backend';
import CardInfo from './cardinfo';
import Pagination from './pagination';
import { ApiResponse } from '../api/backend';
import Loading from '../components/loading';
import { BingoCard } from '../types';

interface CardResults {
    count: number;
    page_size: number;
    results: BingoCard[];
}

type ApiCaller = () => Promise<ApiResponse>;

interface CardListViewProps {
    apiCall: ApiCaller;
    cardQuery: any;
    header: React.FC<{ data: any }>;
}

interface State {
    done: boolean;
    ok: boolean;
    itemData?: any;
    cardData?: any;
}

type Action = 
    | { type: 'failed' }
    | { type: 'loading' }
    | { type: 'success', payload: { cardData: BingoCard, itemData: any } };

const stateReducer = (state: State, action: Action): State => {
    switch (action.type) {
        case 'failed':
            return {
                ...state,
                done: true,
                ok: false,
            };
        case 'loading':
            return {
                ...state,
                done: false,
                ok: true,
            };
        case 'success':
            return {
                ...action.payload,
                done: true,
                ok: true,
            };
    }
};

const CardListView = ({ apiCall, cardQuery, header }: CardListViewProps) => {
    const location = useLocation();
    const initState: State = { done: false, ok: true };
    const [{ done, ok, itemData, cardData }, dispatch] = useReducer(stateReducer, initState);
    
    useEffect(() => {
        (async () => {
            dispatch({ type: 'loading' });

            const { data: itemData, ok: itemOk } = await apiCall();
            if (!itemOk) {
                dispatch({ type: 'failed' });
                return;
            }
            
            const { data: cardData, ok: cardOk } = await api.getCardList(location, cardQuery);
            if (!cardOk) {
                dispatch({ type: 'failed' });
                return;
            }

            dispatch({ type: 'success', payload: {itemData, cardData} });
        })();
    }, []);

    const ItemHeader = header;
    const MainLayout = ({ item, cards }: { item: any, cards: CardResults }) => {

        const PaginationThing = ({ top }: { top?: boolean }) =>
            <div className="p-2">
                <Pagination
                    itemCount={cards.count}
                    pageSize={cards.page_size}
                    label='cards'
                    top={top}
                />
            </div>;

        return (
            <>
                <ItemHeader data={item}/>
                <PaginationThing top />
                <div className='row row-cols-1 row-cols-lg-2'>
                    {cards.results.map(card => (
                        <div className="col p-2">
                            <CardInfo card={card} link/>    
                        </div>
                    ))}
                </div>
                <PaginationThing />
            </>
        );
    }
        
    return (
        !done
            ?
                <Loading message='Getting bingo cards...'/>
            :
                (
                ok && itemData && cardData
                    ?
                        <MainLayout item={itemData} cards={cardData}/>
                    :
                        <> Something went wrong...</>
            )
    );
};

export default CardListView;
