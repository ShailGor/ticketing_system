declare namespace UserEnvironment {
    export interface userInterface {
        id?: number;
        first_name?: string;
        last_name?: string;
        display_name?: string;
        email?: string;
        password?: string;
        phone_number?: string;
        is_email_verified?: Boolean;
        skills?: string;
        uuid?: string;
        otp?: number;
        is_moderator?: Boolean;
        profile_image?: string | null;
        created_at?: Date;
        updated_at?: Date;
        deleted_at?: Date;
    }

    export interface associateInterface extends userInterface {
        userSkills?: any;
    }
}

export = UserEnvironment;
