export const getResponsive = (width) => {
    const isMobile = width < 600;
    const isTablet = width >= 600 && width < 1024;
    const isDesktop = width >= 1024;

    const horizontalPadding = isMobile ? 16 : isTablet ? 24 : 32;
    const contentMaxWidth = isDesktop ? 980 : isTablet ? 760 : 560;

    return {
        isMobile,
        isTablet,
        isDesktop,
        horizontalPadding,
        contentMaxWidth,
    };
};
