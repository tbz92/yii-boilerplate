<?php
/* @var $this UserController */
/* @var $form TbActiveForm */
$form = $this->beginWidget('bootstrap.widgets.TbActiveForm', array(
    'id' => 'speaker-organization-form',
    'enableAjaxValidation' => false,
    'type' => 'horizontal',
));
?>
<div class="container">
    <?php
    echo $form->errorSummary($model);
    ?>
    <h4>Add User</h4>

    <?php
    echo $form->textFieldRow($model, 'name', ['class' => 'form-control', 'placeholder' => 'ABC XYZ']);
    echo $form->textFieldRow($model, 'email', ['class' => 'form-control', 'placeholder' => 'name@example.com']);
    echo $form->textFieldRow($model, 'address', ['class' => 'form-control', 'placeholder' => 'ABC Hill Road']);
    echo $form->fileFieldRow($model, 'file', ['class' => 'form-control' ]);

    $this->widget('bootstrap.widgets.TbButton', array(
        'buttonType' => 'submit',
        'type' => 'primary',
        'label' => 'Save',
    ));

    $this->endWidget();

    ?>
</div>