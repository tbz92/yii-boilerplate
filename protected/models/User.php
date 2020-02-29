<?php

/**
 * This is the model class for table "user".
 *
 * The followings are the available columns in table 'user':
 * @property string $id
 * @property string $first_name
 * @property string $last_name
 * @property string $email
 * @property int $marks
 * @property boolean $status
 * @property string $created_by
 * @property string $created_at
 * @property string $updated_by
 * @property string $updated_at
 */
class User extends CActiveRecord
{
    public $file;

    public function __construct($scenario = 'insert')
    {
        parent::__construct($scenario);
    }

    /**
     * Returns the static model of the specified AR class.
     * @param string $className
     * record class name.
     * @return User the static model class
     */
    public static function model($className = __CLASS__)
    {
        return parent::model($className);
    }

    /**
     * @return string the associated database table name
     */
    public function tableName()
    {
        return 'users';
    }

    /**
     * @return array validation rules for model attributes.
     */
    public function rules()
    {
        // NOTE: you should only define rules for those attributes that
        // will receive user inputs.
        return array(
            array('first_name, last_name, email', 'required'),
            array('first_name, last_name, email', 'length', 'max' => 50),
            array('email', 'email'),
            array('marks', 'numerical', 'integerOnly' => true),
            array('status', 'boolean'),
            array('file', 'file', 'allowEmpty' => true, 'types' => 'jpg, jpeg, png'),
            array('email', 'unique', 'message' => 'This email address is unavailable.'),
            array('id, first_name, last_name, email, marks, status', 'safe', 'on' => 'search'),
        );
    }

    public function findByEmail($email)
    {
        $model = $this->find(array(
            'condition' => "email = :email",
            'params' => array(':email' => $email)
        ));

        return $model;
    }

    protected function beforeValidate()
    {
        if (parent::beforeValidate()) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * @return array customized attribute labels (name=>label)
     */
    public function attributeLabels()
    {
        return array(
            'id' => 'ID',
            'first_name' => 'First Name',
            'last_name' => 'Last Name',
            'email' => 'Email',
            'marks' => 'Marks',
            'status' => 'Status',
            'file' => 'Upload File',
            'created_by' => 'Created By',
            'created_at' => 'Created At',
            'updated_by' => 'Updated By',
            'updated_at' => 'Updated At',
        );
    }

    public function search()
    {
        $criteria = new CDbCriteria;

        $criteria->compare('id', $this->id);
        $criteria->compare('first_name', $this->first_name, true);
        $criteria->compare('last_name', $this->last_name, true);
        $criteria->compare('email', $this->email);
        $criteria->compare('marks', $this->marks);
        $criteria->compare('status', $this->status);
        $criteria->compare('updated_by', $this->updated_by, true);
        $criteria->compare('updated_at', $this->updated_at, true);

        return new CActiveDataProvider($this, array(
            'criteria' => $criteria,
        ));
    }

    protected function afterFind()
    {
        parent::afterFind();
    }

    protected function beforeSave()
    {
        $this->created_by = 'Login user name';
        return parent::beforeSave();
    }

    protected function afterSave()
    {
        parent::afterSave();

        if (!empty($this->file)) {
            $this->file = CUploadedFile::getInstance($this, 'file');
            $this->file->saveAs($this->getFileNameAndBaseUrl());
        }
    }

    public function getFileNameAndBaseUrl()
    {
        return YiiBase::getPathOfAlias('webroot.images.users')
            . DIRECTORY_SEPARATOR
            . $this->email . '.' . $this->file->extensionName;
    }
}