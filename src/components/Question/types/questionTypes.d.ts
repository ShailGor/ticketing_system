declare namespace QuestionEnvironment {
    export interface questionInterface {
        id?: number;
        uuid?: number;
        user_id?: string;
        title?: string;
        description?: string;
        is_published?: Boolean;
        tags?: string;
        image?: string | null;
        created_at?: Date;
        updated_at?: Date;
        deleted_at?: Date;
    }

    export interface associateInterface extends questionInterface {
        questionTag?: any;
    }
}

export = QuestionEnvironment;
