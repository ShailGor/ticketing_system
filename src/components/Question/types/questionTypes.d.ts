declare namespace QuestionEnvironment {
    export interface questionInterface {
        id?: number;
        uuid?: string;
        user_id?: number;
        title?: string;
        description?: string;
        is_published?: boolean;
        tags?: string;
        image?: string | null;
        created_at?: Date;
        updated_at?: Date;
        deleted_at?: Date;
    }

    export interface associateInterface extends questionInterface {
        questionTags?: any;
    }
}

export = QuestionEnvironment;
