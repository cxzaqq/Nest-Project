import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BoardCommentRepository } from './repository/boardComment.repository';
import { BoardCommentEntity } from 'src/entities/boardComment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardService } from './board.service';

@Injectable()
export class BoardCommentService {
  private readonly logger = new Logger(BoardCommentService.name);
  constructor(
    @InjectRepository(BoardCommentEntity)
    private readonly boardCommentRepository: Repository<BoardCommentEntity>,
    private readonly boardService: BoardService,
  ) {}

  /**
   * get all comments
   * @param id
   * @returns comments
   */
  async getComment(id: number): Promise<object> {
    try {
      const comment = this.boardCommentRepository
        .createQueryBuilder('boardComment')
        .select([
          'boardComment.id',
          'boardComment.contents',
          'boardComment.dateTime',
          'boardComment.isDeleted',
          'boardComment.isModified',
          'boardComment.boardId',
          'boardComment.userId',
          'user.nickname',
        ])
        .where('"boardId" = :boardId', { boardId: id })
        .andWhere('"isDeleted" = :isDeleted', { isDeleted: false })
        .leftJoin('boardComment.user', 'user')
        .orderBy('boardComment.dateTime', 'DESC')
        .getRawMany();

      return comment;
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '댓글 조회 중 에러 발생',
          success: false,
        },
        500,
      );
    }
  }

  /**
   * create comment
   * @param createData
   * @returns success: true
   */
  async createComment(createData, headers): Promise<object> {
    try {
      const token = headers.authorization.replace('Bearer ', '');
      const verified = await this.boardService.checkToken(token);
      const commentData = new BoardCommentEntity();
      commentData.contents = createData.contents;
      commentData.user = verified.userId;
      commentData.board = createData.boardId;
      commentData.isDeleted = false;
      commentData.isModified = false;
      commentData.dateTime = new Date();

      await this.boardCommentRepository
        .createQueryBuilder()
        .insert()
        .into('boardComment')
        .values({
          contents: commentData.contents,
          dateTime: commentData.dateTime,
          isDeleted: commentData.isDeleted,
          isModified: commentData.isModified,
          user: commentData.user,
          board: commentData.board,
        })
        .execute();

      return { success: true };
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '댓글 생성 중 에러 발생',
          success: false,
        },
        500,
      );
    }
  }

  /**
   * update comment
   * @param updateData
   * @return success: true
   */
  async updateComment(updateData, headers): Promise<object> {
    try {
      const token = headers.authorization.replace('Bearer ', '');
      const verified = await this.boardService.checkToken(token);
      const check = await this.boardService.checkTokenId(
        updateData.userId,
        verified.userId,
      );
      if (check) {
        const commentData = new BoardCommentEntity();
        commentData.id = updateData.id;
        commentData.contents = updateData.contents;
        commentData.user = verified.userId;
        commentData.board = updateData.boardId;
        commentData.isDeleted = false;
        commentData.isModified = true;

        await this.boardCommentRepository
          .createQueryBuilder('boardComment')
          .update()
          .set({
            contents: commentData.contents,
            isModified: commentData.isModified,
          })
          .where('id = :id', { id: commentData.id })
          .andWhere('userId = :userId', { userId: commentData.user })
          .execute();

        return { success: true };
      } else return { success: false, msg: '유저 불일치' };
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '댓글 수정 중 에러 발생',
          success: false,
        },
        500,
      );
    }
  }

  /**
   * delete comment
   * @param deleteData
   * @returns success: true
   */
  async deleteComment(deleteData, headers): Promise<object> {
    try {
      const token = headers.authorization.replace('Bearer ', '');
      const verified = await this.boardService.checkToken(token);
      const check = await this.boardService.checkTokenId(
        deleteData.userId,
        verified.userId,
      );
      if (check) {
        await this.boardCommentRepository
          .createQueryBuilder('boardComment')
          .update()
          .set({
            isDeleted: true,
          })
          .where('id = :id', { id: deleteData.id })
          .andWhere('userId = :userId', { userId: deleteData.userId })
          .execute();

        return { success: true };
      } else return { success: false, msg: '유저 불일치' };
    } catch (err) {
      this.logger.error(err);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: '댓글 삭제 중 에러 발생',
          success: false,
        },
        500,
      );
    }
  }
}
