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
        $model = $this->loadModel($id);
    }

    public function actionList()
    {
        $this->render('list', [
            'users' => User::model()->findAll()
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