<?php

class UserController extends Controller
{
    public function actionIndex()
    {
        $this->render('index');
    }

    public function actionCreate()
    {
        /** @var User $model */
        $model = new User();

        if (Yii::app()->request->isPostRequest) {
            $model->attributes = Yii::app()->request->getPost('User');
            $model->file = CUploadedFile::getInstance($model, 'file');

            if ($model->save()) {
                $this->redirect(array('user/list'));
            }
        }

        $this->render('form', [
            'model' => $model
        ]);
    }

    public function actionUpdate($id)
    {
        $model = $this->loadModel($id);

        if (Yii::app()->request->isPostRequest) {
            $model->attributes = Yii::app()->request->getPost('User');
            $model->file = CUploadedFile::getInstance($model, 'file');

            if ($model->save()) {
                $this->redirect(array('user/list'));
            }
        }

        $this->render('form', [
            'model' => $model
        ]);
    }

    public function actionDelete($id)
    {
        if ($model = $this->loadModel($id)) {

            if ($model->delete()) {
                $this->redirect(array('user/list'));
            }
        }
    }

    public function actionList($status = 1)
    {
        $this->render('list', [
            'users' => User::model()->findAll("status = $status")
        ]);
    }

    public function loadModel($id)
    {
        $model = User::model()->findByPk($id);

        if ($model === null) {
            throw new CHttpException(404, 'The requested page does not exist.');
        }

        return $model;
    }
}