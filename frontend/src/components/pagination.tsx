import { ReactElement } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Location } from 'history';
import Dropdown from 'react-bootstrap/Dropdown';

const getDefaultSort = (params: URLSearchParams) => params.get('sort') || 'hot';
const orderingParams: { [s: string]: string } = {
    new: '-created_at',
    popular: '-best,-created_at',
    hot: '-hot,-created_at',
};

const getRange = (start: number, end: number) => {
    return Array(end - start + 1)
        .fill(0)
        .map((_, i) => i + start);
};
const pagination = (currentPage: number, pageCount: number) => {
    let delta: number;
    if (pageCount <= 7) {
        // delta === 7: [1 2 3 4 5 6 7]
        delta = 7;
    } else {
        // delta === 2: [1 ... 4 5 6 ... 10]
        // delta === 4: [1 2 3 4 5 ... 10]
        delta = currentPage > 4 && currentPage < pageCount - 3 ? 2 : 4;
    }

    const range = {
        start: Math.round(currentPage - delta / 2),
        end: Math.round(currentPage + delta / 2)
    };

    if (range.start - 1 === 1 || range.end + 1 === pageCount) {
        range.start += 1;
        range.end += 1;
    }

    let pages: any =
        currentPage > delta
            ? getRange(Math.min(range.start, pageCount - delta), Math.min(range.end, pageCount))
            : getRange(1, Math.min(pageCount, delta + 1));

    const withDots = (value: any, pair: any) => (pages.length + 1 !== pageCount ? pair : [value]);

    if (pages[0] !== 1) {
        pages = withDots(1, [1, 0]).concat(pages);
    }

    if (pages[pages.length - 1] < pageCount) {
        pages = pages.concat(withDots(pageCount, [0, pageCount]));
    }

    return pages;
}

interface PaginationProps {
    itemCount: number;
    pageSize: number;
    label: string;
    top?: boolean;
}

const Pagination = ({ pageSize, itemCount, label, top = false }: PaginationProps) => {
    const buttonShape = 'w-100 rounded p-2 text-center';
    const pageCount = Math.ceil(itemCount / pageSize);

    const loc = useLocation();
    const paginationUrl = loc.pathname;
    const urlParams = new URLSearchParams(loc.search);
    const currentSort = getDefaultSort(urlParams);
    const pageNum = parseInt(urlParams.get('page') || '1');
    urlParams.delete('page');
    const urlParamsString = urlParams.toString();

    const PageItem = ({ index = 0 }: { index?: number }) => {
        const color = 
            index === pageNum
                ? 'bg-sdark-orange text-white'
                : 'sdark-fg';

        const innerButton =
            <div className={`${buttonShape} ${color} ${(index ? 'page-btn' : '')}`}>
                {index ? index : '...'}
            </div>;

        let button: ReactElement;

        if (index && index !== pageNum) {
            let params = new URLSearchParams(urlParamsString);
            params.set('page', `${index}`);
            button =
                <Link to={`${paginationUrl}?${params.toString()}`}>
                    {innerButton}
                </Link>;
        } else {
            button = innerButton;
        }

        return button;
    }

    const sortDropdown = (
        <Dropdown>
            <Dropdown.Toggle id='sort-dropdown' className={`sdark-fg border-0 p-0 w-100 ${buttonShape}`}>
                sort: {currentSort}
            </Dropdown.Toggle>

            <Dropdown.Menu className='w-100 slight-bg'>
                <Dropdown.ItemText>Sort by</Dropdown.ItemText>
                <Dropdown.Divider/>
                {Object.keys(orderingParams).map(option => {
                    urlParams.set('sort', option);
                    return (
                        option === currentSort
                            ? <Dropdown.Item disabled>
                                  {option}
                              </Dropdown.Item>

                            : <Dropdown.Item
                                  as={Link}
                                  to={`${paginationUrl}?${urlParams.toString()}`}
                              >
                                  {option}
                              </Dropdown.Item>
                    )})}
            </Dropdown.Menu>
        </Dropdown>
    );

    
    const PageButtons = ({ rowSize }: { rowSize: number }) => {
        let paginationItems: (number | null)[] = pagination(pageNum, pageCount);

        if (paginationItems.length < rowSize)
            Array(rowSize - paginationItems.length).fill(null)
                .forEach(thing => paginationItems.push(thing));

        paginationItems.push(paginationItems.slice(-1)[0]);
        
        return (
            <div className={`row row-cols-${rowSize}`}>
                {paginationItems.map((item, index) => {
                    let rPad = 'pr-2';
                    let disp = '';
                    let endIndex = rowSize - 1;

                    if (index > endIndex) {
                        disp = 'd-none d-lg-block';
                    }
                    else if (index === endIndex) {
                        disp = 'd-lg-none';
                        rPad = '';
                    }

                    return (
                        <div className={`col p-0 ${disp}`}>
                            <div className={rPad}>
                                {
                                    item !== null &&
                                        <PageItem index={item}/>
                                }
                            </div>
                        </div>
                    );
                })}
            </div>
        ); 
    }

    return (
        <div className="row">

            {
                top &&
                    <>
                        <div className="col-12 d-lg-none">
                            <div className="row">
                                <div className="col-6 p-0">
                                    <div className='pr-1'>
                                        <div className={`sdark-fg ${buttonShape}`}>
                                            {itemCount} {label}
                                        </div>
                                    </div>
                                </div>
                                <div className="pl-1 col-6 p-0">
                                    {sortDropdown}
                                </div>
                            </div>
                        </div>
                
                        <div className="col-12 d-lg-none p-0">
                            <hr className="sdark-spacer my-2" />
                        </div>
                    </>
            }
            
            <div className="col-12 col-lg-6">
                <PageButtons rowSize={7}/>
            </div>

            <div className="d-none d-lg-block col-3">
            </div>
            
            <div className="d-none d-lg-block col-3">
                {
                    top &&                 
                        <div className="row">
                            <div className="col-6 p-0">
                                <div className='pl-2 pr-1'>
                                    <div className={`sdark-fg ${buttonShape}`}>
                                        {itemCount} {label}
                                    </div>
                                </div>
                            </div>
                            <div className="pl-1 col-6 p-0">
                                {sortDropdown}
                            </div>
                        </div>
                }
            </div>
        </div>
    );
};

export default Pagination;

export const toApiQuery = (location: Location, query: object = {}) => {
    let urlParams = new URLSearchParams(location.search);
    urlParams.set('ordering', orderingParams[getDefaultSort(urlParams)]);
    urlParams.delete('sort');

    Object.entries(query)
          .forEach(([ key, value ]) =>
               urlParams.set(key, value));
    
    return urlParams.toString();
};
