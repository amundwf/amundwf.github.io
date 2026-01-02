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
        src: '/placeholder.png',
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
    ],
    socialLinks: [
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
        text: "I have a background in physics and I'm currently developing my skills in the data fields. The main purpose of this site is to have a place where I can showcase some relevant professional skills I've learned outside of my formal education. As I learn more things in data science, data engineering or adjacent fields, I'll once in a while do a project and post it on this site.",
        //"I have a background in physics and I'm currently developing my skills and experience in data science. The main purpose of this site is to have a place where I can showcase some relevant professional skills I've learned outside of my formal education. As I learn new things related to data science or adjacent fields, I'll once in a while do a project using what I've learned and post it on this site.",
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
    //     title: 'Subscribe to ...',
    //     text: 'One update per week. All the latest posts directly in your inbox.',
    //     formUrl: '#'
    // },
    postsPerPage: 8,
    projectsPerPage: 8
};

export default siteConfig;
