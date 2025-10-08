export type RegisterData = {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
};

export type LoginData = {
    email: string;
    password: string;
};

export type OAuthData = {
    email: string;
    name?: string;
    image?: string;
};

export type SetPasswordData = {
    email: string;
    password: string;
};
