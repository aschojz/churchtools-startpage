import Showdown from 'showdown';

export function mdConverter() {
    return new Showdown.Converter({
        flavor: 'original',
        emoji: true,
        tables: true,
        strikethrough: true,
        tasklists: false,
        parseImgDimensions: true,
        simplifiedAutoLink: true,
        underline: true,
        simpleLineBreaks: true,
        disableForced4SpacesIndentedSublists: true,
        ellipsis: false,
    });
}

export const mdToHtml = (md: string = '') => mdConverter().makeHtml(md);

export const getName = (originalName: string = '') => {
    return originalName;
};
