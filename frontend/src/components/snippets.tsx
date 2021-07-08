import { ReactNode } from 'react';

interface HeaderProps {
    card?: boolean;
    children: ReactNode;
}

export const Header = ({ card, children }: HeaderProps) => (
    <div className="row">
        <div className="w-100">
            <div className="row">
                <div className="col-2 d-none d-lg-block"/>
                <div className="col-12 col-lg-8">
                    <div>
                        {card
                            ?
                                <div className="py-4 text-center rounded sdark-fg m-2">
                                    {children}
                                </div>
                            :
                                children}
                    </div>
                </div>
                <div className="col-2 d-none d-lg-block"/>
            </div>
        </div>
    </div>
);

interface InfoHeaderProps {
    subject: string;
    info: ReactNode[];
}

const infoPadding = (index: number, max: number) => {
    switch (index) {
        case 0:
            return `pb-${gridPadding}`;
        case max:
            return `pt-${gridPadding}`;
        default:
            return `py-${gridPadding}`;
    }
}

const gridPadding = 1;
const headerItem = 'rounded text-center sdark-fg p-3 w-100';
const centeredItems = 'h-100 d-flex align-items-center justify-content-center';

export const InfoHeader = ({ subject, info }: InfoHeaderProps) => (
    <Header>

        <div className="p-2">
            <div className="row">
                <div className={`col-8 pr-${gridPadding}`}>
                    <div className={`${centeredItems} ${headerItem}`}>
                        <h3>
                            {subject}
                        </h3>
                    </div>
                </div>
                <div className={`col-4 pl-${gridPadding}`}>
                    <div>
                        <div className="col">
                            {
                                info.map((tidbit, index) => (
                                    <div className={`row ${infoPadding(index, info.length - 1)}`}>
                                        <div className={`${headerItem} w-100`}>
                                            {tidbit}
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 px-2 d-none">
            <div className="row">
                <div className={`col pb-${gridPadding}`}>
                    <div className={headerItem}>
                        <div className="p-2">
                        <h2>
                            {subject}
                        </h2>
                        </div>
                    </div>
                </div>
            </div>
            <div className="row row-cols-2">
                {
                    info.map((tidbit, index) => (
                        <div className={`col py-${gridPadding} ${(index % 2 === 0 ? 'pr' : 'pl')}-${gridPadding}`}>
                            <div className={`${centeredItems} ${headerItem}`}>
                                {tidbit}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
      
    </Header>
);

export const edgePadding: string[] = (() => {
    let paddingIndexes: { [s: string]: number[] } = {
        'pt-1': [1, 2, 3, 4, 5],      // top
        'pr-1': [5, 10, 15, 20, 25],  // right
        'pl-1': [1, 6, 11, 16, 21],   // left
        'pb-1': [21, 22, 23, 24, 25], // bottom
    }

    return Array(25)
        .fill(0)
        .map((_, tileIndex) => {
            tileIndex++;
            let padding = ['pt-1', 'pb-1', 'pl-1', 'pr-1'];

            Object.entries(paddingIndexes).forEach(([ pad, indexes ]) => {
                if (indexes.includes(tileIndex)) {
                    let padIndex = padding.indexOf(pad);
                    padding.splice(padIndex, 1);
                }
            });

            return padding.join(' ');
        })
})();

export const parseDate = (s: string) => {
    let date = new Date(Date.parse(s));
    return date.toLocaleString();
};
