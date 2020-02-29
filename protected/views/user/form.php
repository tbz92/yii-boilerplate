<?php
/* @var $this UserController */
/* @var $form TbActiveForm */
$form = $this->beginWidget('bootstrap.widgets.TbActiveForm', array(
    'id' => 'user-details-form',
    'enableAjaxValidation' => false,
    'type' => 'horizontal',
    'htmlOptions' => array('enctype' => 'multipart/form-data', 'autocomplete' => 'off'),
));
?>
<div class="container col-md-6">
    <?php
    echo $form->errorSummary($model);
    ?>
    <h4>Add User</h4>

    <?php
    echo $form->textFieldRow($model, 'first_name', ['class' => 'form-control']);
    echo $form->textFieldRow($model, 'last_name', ['class' => 'form-control']);
    echo $form->textFieldRow($model, 'email', ['class' => 'form-control']);
    echo $form->textFieldRow($model, 'marks', ['class' => 'form-control']);
    echo $form->checkBoxRow($model, 'status');
    echo $form->fileFieldRow($model, 'file', ['class' => 'form-control']);

    $this->widget('bootstrap.widgets.TbButton', array(
        'buttonType' => 'submit',
        'type' => 'primary',
        'label' => 'Save',
    ));

    $this->endWidget();

    ?>
</div>