<?php

namespace backend\controllers;

use yii;
use backend\models\Guest;
use backend\models\search\GuestSearch;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\filters\VerbFilter;
use backend\controllers\SiteController;
use backend\models\Badges;

/**
 * GuestController implements the CRUD actions for Guest model.
 */
class GuestController extends SiteController {

	public $enableCsrfValidation = true;

	public function behaviors() {
		return [
			'verbs' => [
				'class' => VerbFilter::className(),
				'actions' => [
					'delete' => ['POST'],
				],
			],
		];
	}

	public function actionCreate() {
		$model = new Guest();
		if (Yii::$app->request->isAjax && $model->load(Yii::$app->request->post())) {
			Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
			return yii\widgets\ActiveForm::validate($model);
		}
		elseif ($model->load(Yii::$app->request->post())) {
			$model->g_first_name = trim($model->g_first_name);
			$model->g_last_name = trim($model->g_last_name);
			$model->g_city = trim($model->g_city);
			$model->g_state = strtoupper(trim($model->g_state));
			if ($model->tmp_badge) { $model->tmp_badge = trim($model->tmp_badge); }

			if($model->save()) {
				Yii::$app->getSession()->setFlash('success', 'Guest has been added!');

				$guest = Guest::find()->where(['id'=>$model->id])->one();
				if($guest->save()) {
					$model->save();
				}

				if(($_POST['Guest']['guest_count']) && $_POST['Guest']['guest_count'] > 1 )  {
					$this->createLog($this->getNowTime(), $_SESSION['user'], 'Added Guest: '.$model->g_first_name.' For Badge: '.$model->badge_number.' Paid: '.$model->g_paid.' and ' );
					$stickyGuest = [
						'badge_number'=>$model->badge_number,
						'g_paid'=>$model->g_paid,
						'guest_count'=> $_POST['Guest']['guest_count'] - 1,
						'payment_type'=>$model->payment_type,
						'time_in'=>$model->time_in,
					];
					$_SESSION['stickyForm'] = $stickyGuest;
					return $this->redirect(['/guest/create']);
				} else  {
					$this->createLog($this->getNowTime(), $_SESSION['user'], 'Added Guest: '.$model->g_first_name.' For Badge: '.$model->badge_number.' Paid: '.$model->g_paid );
					unset( $_SESSION['stickyForm'] );
					return $this->redirect(['/guest/index']);
				}

			} else {
				$this->createLog(true, 'trex_C_GC:70 SaVE ERROR', var_export($model->errors,true));

				Yii::$app->getSession()->setFlash('error', 'action create - no save?');
				return $this->redirect(['/guest/index']);
			}
		}
		else {
			return $this->render('create', [ 'model' => $model ]);
		}
	}

	public function actionDelete($id) {
		if($model=$this->findModel($id)) {
			$this->createLog($this->getNowTime(), $_SESSION['user'], 'Deleted Guest: '.$id." Name: ".$model->g_first_name.' of Badge: '.$model->badge_number.' Paid: '.$model->g_paid );
			$model->delete();
			Yii::$app->getSession()->setFlash('success', 'Guest #'.$id.' Deleted');
		} 
		return $this->redirect(['index']);
	}

	public function actionIndex() {
		\backend\controllers\RsoRptController::OpenReport();
		$searchModel = new GuestSearch();
		$dataProvider = $searchModel->search(Yii::$app->request->queryParams);

		if(!yii::$app->controller->hasPermission('guest/all')) {
			$sqlwhere="badge_number=".$_SESSION["badge_number"];
			$dataProvider->query->andWhere($sqlwhere);
		}
		return $this->render('index', [
			'searchModel' => $searchModel,
			'dataProvider' => $dataProvider,
		]);
	}

	public function actionOut($id) {
		$nowDate = date("Y-m-d G:i:s",strtotime(yii::$app->controller->getNowTime()));

		$sql="UPDATE guest set time_out='".$nowDate. "' WHERE id=".$id;
		$connection = Yii::$app->getDb();
		$command = $connection->createCommand($sql);
		$saveOut = $command->execute();
		Yii::warning("Rec Updated? ".$saveOut);

		if($saveOut) {
			Yii::$app->getSession()->setFlash('success', 'Guest has been Checked out');
		} else {
			Yii::$app->getSession()->setFlash('error', 'Failed to Check out');
		}
		return $this->redirect(['/guest/index']);
	}

	public function actionStats() {
		$searchModel = new GuestSearch();
		$dataProvider = $searchModel->search(Yii::$app->request->queryParams);

		return $this->render('stats', [
			'searchModel' => $searchModel,
			'dataProvider' => $dataProvider,
		]);
	}

	public function actionStickyForm($type) {
		yii::$app->controller->createLog(false, 'trex_C_GC:163', var_export('her',true));
		if($type=='true') {
			$session = Yii::$app->session;
			$session->set('stickyForm', 'true');
			$responce = ['status'=>true,];
			return json_encode($responce,true);
		}
		else if($type=='false') {
			$session = Yii::$app->session;
			$session->set('stickyForm', 'false');
			$responce = ['status'=>false,];
			return json_encode($responce,true);
		}
	}

	public function actionApiCreate() {
		Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
		header('Access-Control-Allow-Origin: http://localhost:3000');
		header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
		header('Access-Control-Allow-Credentials: true');

		if (Yii::$app->request->isOptions) {
			return [];
		}

		$model = new Guest();
		$data = json_decode(Yii::$app->request->getRawBody(), true);
		
		if ($data && $model->load($data, '')) {
			$model->g_first_name = trim($model->g_first_name);
			$model->g_last_name = trim($model->g_last_name);
			$model->g_city = trim($model->g_city);
			$model->g_state = strtoupper(trim($model->g_state));
			if ($model->tmp_badge) { $model->tmp_badge = trim($model->tmp_badge); }

			if($model->save()) {
				$this->createLog($this->getNowTime(), $_SESSION['user'] ?? 'api', 'Added Guest via API: '.$model->g_first_name.' For Badge: '.$model->badge_number.' Paid: '.$model->g_paid);
				return ['status' => 'success', 'data' => $model->toArray(), 'message' => 'Guest created successfully'];
			} else {
				return ['status' => 'error', 'errors' => $model->errors, 'message' => 'Failed to create guest'];
			}
		}
		return ['status' => 'error', 'message' => 'Invalid data provided'];
	}

	public function actionApiUpdate($id) {
		Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
		header('Access-Control-Allow-Origin: http://localhost:3000');
		header('Access-Control-Allow-Methods: POST, PUT, GET, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
		header('Access-Control-Allow-Credentials: true');

		if (Yii::$app->request->isOptions) {
			return [];
		}

		$model = $this->findModel($id);
		$data = json_decode(Yii::$app->request->getRawBody(), true);
		
		if ($data && $model->load($data, '')) {
			$model->g_first_name = trim($model->g_first_name);
			$model->g_last_name = trim($model->g_last_name);
			$model->g_city = trim($model->g_city);
			$model->g_state = strtoupper(trim($model->g_state));
			if ($model->tmp_badge) { $model->tmp_badge = trim($model->tmp_badge); }

			if($model->save()) {
				$this->createLog($this->getNowTime(), $_SESSION['user'] ?? 'api', 'Updated Guest via API: '.$model->g_first_name.' ID: '.$id);
				return ['status' => 'success', 'data' => $model->toArray(), 'message' => 'Guest updated successfully'];
			} else {
				return ['status' => 'error', 'errors' => $model->errors, 'message' => 'Failed to update guest'];
			}
		}
		return ['status' => 'error', 'message' => 'Invalid data provided'];
	}

	public function actionApiList() {
		Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
		header('Access-Control-Allow-Origin: http://localhost:3000');
		header('Access-Control-Allow-Methods: GET, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
		header('Access-Control-Allow-Credentials: true');

		if (Yii::$app->request->isOptions) {
			return [];
		}

		$searchModel = new GuestSearch();
		$dataProvider = $searchModel->search(Yii::$app->request->queryParams);

		if(!yii::$app->controller->hasPermission('guest/all')) {
			$sqlwhere="badge_number=".$_SESSION["badge_number"];
			$dataProvider->query->andWhere($sqlwhere);
		}

		$guests = [];
		foreach ($dataProvider->getModels() as $guest) {
			$guests[] = $guest->toArray();
		}

		return [
			'status' => 'success',
			'data' => $guests,
			'pagination' => [
				'totalCount' => $dataProvider->getTotalCount(),
				'pageCount' => $dataProvider->getPagination()->getPageCount(),
				'currentPage' => $dataProvider->getPagination()->getPage(),
				'pageSize' => $dataProvider->getPagination()->getPageSize(),
			]
		];
	}

	public function actionApiCheckout($id) {
		Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
		header('Access-Control-Allow-Origin: http://localhost:3000');
		header('Access-Control-Allow-Methods: POST, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
		header('Access-Control-Allow-Credentials: true');

		if (Yii::$app->request->isOptions) {
			return [];
		}

		$nowDate = date("Y-m-d G:i:s",strtotime(yii::$app->controller->getNowTime()));
		$sql="UPDATE guest set time_out='".$nowDate. "' WHERE id=".$id;
		$connection = Yii::$app->getDb();
		$command = $connection->createCommand($sql);
		$saveOut = $command->execute();

		if($saveOut) {
			$this->createLog($this->getNowTime(), $_SESSION['user'] ?? 'api', 'Checked out Guest via API: ID '.$id);
			return ['status' => 'success', 'message' => 'Guest checked out successfully'];
		} else {
			return ['status' => 'error', 'message' => 'Failed to check out guest'];
		}
	}

	public function actionApiDelete($id) {
		Yii::$app->response->format = yii\web\Response::FORMAT_JSON;
		header('Access-Control-Allow-Origin: http://localhost:3000');
		header('Access-Control-Allow-Methods: DELETE, OPTIONS');
		header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
		header('Access-Control-Allow-Credentials: true');

		if (Yii::$app->request->isOptions) {
			return [];
		}

		if($model=$this->findModel($id)) {
			$this->createLog($this->getNowTime(), $_SESSION['user'] ?? 'api', 'Deleted Guest via API: '.$id." Name: ".$model->g_first_name.' of Badge: '.$model->badge_number.' Paid: '.$model->g_paid);
			$model->delete();
			return ['status' => 'success', 'message' => 'Guest deleted successfully'];
		}
		return ['status' => 'error', 'message' => 'Guest not found'];
	}

	public function actionUpdate($id) {
		$model = $this->findModel($id);

		if ($model->load(Yii::$app->request->post())) {
			$guest = Guest::find()->where(['id'=>$model->id])->one();
			$guest->badge_number = $model->badge_number;
			$guest->g_first_name = trim($model->g_first_name);
			$guest->g_last_name = trim($model->g_last_name);
			$guest->g_city = trim($model->g_city);
			$guest->g_state = strtoupper(trim($model->g_state));
			$guest->g_yob = $model->g_yob;
			$guest->tmp_badge = trim($model->tmp_badge);
			$guest->time_in = date('Y-m-d H:i:s',strtotime($model->time_in));
			if(!isset($guest->guest_count)) $guest->guest_count = 1;
			if(!isset($guest->payment_type)) $guest->payment_type = 'cash';

			if($guest->save()) {
				$sql = "update guest set g_paid ='$model->g_paid' where id = $model->id";
				$cmd = Yii::$app->getDb()->createCommand($sql)->execute();
				Yii::$app->getSession()->setFlash('success', 'Guest has been updated');
				return $this->redirect(['/guest/index']);
			} else {
				yii::$app->controller->createLog(true, 'trex_C_GC:171 Save error', var_export($model->errors,true));
				Yii::$app->getSession()->setFlash('error', 'Failed to update record');
				return $this->render('update', ['model' => $model,]);
			}
		} else {
			return $this->render('update', [
				'model' => $model,
			]);
		}
	}

	public function actionView($id) {
		$model = new \backend\models\Guest();
		return $this ->render('create', [
			'model' => $this->findModel($id),
		]);
	}

	protected function findModel($id) {
		if (($model = Guest::findOne($id)) !== null) {
			return $model;
		} else {
			throw new NotFoundHttpException('The requested page does not exist.');
		}
	}
}
