export const edgePadding: string[] = (() => {
    let paddingIndexes: { [s: string]: number[] } = {
        "pt-1": [1, 2, 3, 4, 5], // top
        "pe-1": [5, 10, 15, 20, 25], // right
        "ps-1": [1, 6, 11, 16, 21], // left
        "pb-1": [21, 22, 23, 24, 25], // bottom
    };

    return Array(25)
        .fill(0)
        .map((_, tileIndex) => {
            tileIndex++;
            let padding = ["pt-1", "pb-1", "ps-1", "pe-1"];

            Object.entries(paddingIndexes).forEach(([pad, indexes]) => {
                if (indexes.includes(tileIndex)) {
                    let padIndex = padding.indexOf(pad);
                    padding.splice(padIndex, 1);
                }
            });

            return padding.join(" ");
        });
})();

/*
const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
];
*/

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export const dateStr = (s: string) => {
    const date = new Date(Date.parse(s));
    const now = new Date();
    const yearStr = date.getFullYear() !== now.getFullYear() ? `, ${date.getFullYear() % 100}` : "";

    //return date.toLocaleString();
    return `${monthNames[date.getMonth()]} ${date.getDate()}${yearStr}`;
};

const minute = 1000 * 60;
const hour = minute * 60;
const day = hour * 24;
const month = day * 31;
const year = month * 12;
const times: { [s: string]: number } = {
    year: year,
    month: month,
    day: day,
    hour: hour,
    minute: minute,
};

export const createdAtStr = (isoString: string) => {
    var now = new Date(Date.now());
    var date = new Date(Date.parse(isoString));
    var diff = now.getTime() - date.getTime();

    for (const str in times) {
        let time = times[str];
        if (diff >= time) {
            let value = Math.floor(diff / time);
            value = time === minute ? value % 60 : value;
            let s = value > 1 ? "s" : "";
            return `${value} ${str}${s} ago`;
        }
    }

    return "just now";
};
