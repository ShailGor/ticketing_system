declare namespace AnswerEnvironment {
    export interface answerInterface {
        id?: number;
        uuid?: number;
        user_id?: string;
        question_id?: string;
        answer?: string;
        is_accepted?: Boolean;
        answer_image?: string | null;
        created_at?: Date;
        updated_at?: Date;
        deleted_at?: Date;
    }
}

export = AnswerEnvironment;
