<?php

/**
 * This is the model class for table "user".
 *
 * The followings are the available columns in table 'user':
 * @property string $id
 * @property string $name
 * @property string $email
 * @property string $address
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
            array('name, email', 'required'),
            array('name, email', 'length', 'max' => 50),
            array('email', 'email'),
            array('email', 'unique', 'message' => 'This email address is unavailable.'),
            array('id, name, email, address', 'safe', 'on' => 'search'),
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
            'name' => 'Name',
            'email' => 'Email',
            'address' => 'Address',
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
        $criteria->compare('name', $this->name, true);
        $criteria->compare('email', $this->email);
        $criteria->compare('address', $this->address);
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
    }
}