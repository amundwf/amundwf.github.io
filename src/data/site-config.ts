export type Image = {
    src: string;
    alt?: string;
    caption?: string;
};

export type Link = {
    text: string;
    href: string;
};

export type Hero = {
    title?: string;
    text?: string;
    image?: Image;
    actions?: Link[];
};

export type Subscribe = {
    title?: string;
    text?: string;
    formUrl: string;
};

export type SiteConfig = {
    logo?: Image;
    title: string;
    subtitle?: string;
    description: string;
    image?: Image;
    headerNavLinks?: Link[];
    footerNavLinks?: Link[];
    socialLinks?: Link[];
    hero?: Hero;
    subscribe?: Subscribe;
    postsPerPage?: number;
    projectsPerPage?: number;
};

const siteConfig: SiteConfig = {
    title: 'Amund Fredriksen',
    // subtitle: '',
    description: 'Portfolio website, Amund Fredriksen',
    image: {
        // src: '/dante-preview.jpg',
        src: '/placeholder.png',
        // alt: 'Dante - Astro.js and Tailwind CSS theme'
        alt: 'Portfolio website'
    },
    headerNavLinks: [
        {
            text: 'Home',
            href: '/'
        },
        {
            text: 'About',
            href: '/about'
        },
        {
            text: 'Projects',
            href: '/projects'
        },

        // {
        //     text: 'Blog',
        //     href: '/blog'
        // },

        // {
        //     text: 'Tags',
        //     href: '/tags'
        // }
    ],
    footerNavLinks: [
        // {
        //     text: 'About',
        //     href: '/about'
        // },
        // {
        //     text: 'Contact',
        //     href: '/contact'
        // }

        // {
        //     text: 'Terms',
        //     href: '/terms'
        // },
        // {
        //     text: 'Download theme',
        //     href: 'https://github.com/JustGoodUI/dante-astro-theme'
        // }
    ],
    socialLinks: [
        // {
        //     text: 'Dribbble',
        //     href: 'https://dribbble.com/'
        // },
        // {
        //     text: 'Instagram',
        //     href: 'https://instagram.com/'
        // },
        // {
        //     text: 'X/Twitter',
        //     href: 'https://twitter.com/'
        // }
        {
            text: 'Contact',
            href: '/contact'
        },
        {
            text: 'LinkedIn',
            href: 'https://www.linkedin.com/in/amund-fredriksen-42a253297/'
        }
    ],
    hero: {
        title: 'Hello and welcome!',
        // text: "I'm **Ethan Donovan**, a web developer at Amazing Studio, dedicated to the realms of collaboration and artificial intelligence. My approach involves embracing intuition, conducting just enough research, and leveraging aesthetics as a catalyst for exceptional products. I have a profound appreciation for top-notch software, visual design, and the principles of product-led growth. Feel free to explore some of my coding endeavors on <a href='https://github.com/JustGoodUI/dante-astro-theme'>GitHub</a> or follow me on <a href='https://twitter.com/justgoodui'>Twitter/X</a>.",]
        // text: "I'm Amund Fredriksen, someone new to the field of data analysis with a background in physics. The main purpose of this site is to have a place where I can document some of the relevant professional skills I've learned outside of my formal education. As I learn new things related to data analysis and data science, I'll once in a while do a project using what I've learned and post it on this site.",
        text: "I have a background in physics and am new to the field of data analysis. The main purpose of this site is to have a place where I can showcase some relevant professional skills I've learned outside of my formal education. As I learn new things related to data analysis and data science, I'll once in a while do a project using what I've learned and post it on this site.",
        // text: "I'm Amund Fredriksen, a budding data analyst with a background in physics. The main purpose of this site is to have a place where I can document some of the relevant professional skills I've learned outside of my formal education. As I learn new things related to data analysis and data science, I'll once in a while do a project using what I've learned and post it on this site.",
        // "My overall goal with my work is to have a positive impact on people's well-being."
        image: {
            // src: '/hero.jpeg',
            src: '/placeholder-black-line.png',
            // alt: 'Image'
        },
        actions: [
            {
                text: 'Contact',
                href: '/contact'
            }
        ]
    },
    // subscribe: {
    //     title: 'Subscribe to Dante Newsletter',
    //     text: 'One update per week. All the latest posts directly in your inbox.',
    //     formUrl: '#'
    // },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;
